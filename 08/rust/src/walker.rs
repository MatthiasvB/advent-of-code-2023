use colored::{Color, ColoredString, Colorize};
use core::panic;
use fnv::{FnvBuildHasher, FnvHashMap, FnvHashSet};
use lazy_static::lazy_static;
use regex::Regex;
use std::{
    collections::{hash_map::RandomState, HashMap},
    error::Error,
    fmt::{Debug, Display},
    hash::Hash,
};
use tap::{Conv, Pipe, Tap, TapOptional};

use crate::tapif::TapIfSized;

macro_rules! debug {
    ($($arg:tt)*) => {{
        #[cfg(feature = "debug")]
        println!($($arg)*);
    }};
}

/**
 * Public interface of a solver for the Advent of Code 2023 day 08 challenge part two.
 */
pub trait AOC8Solver<'a> {
    /**
     * Create a solver
     */
    fn new(walk_instructions: &'a str) -> Self;

    /**
     * Calculate the solution to part 1
     */
    fn solve_part_1(self: &Self) -> usize;

    /**
     * Calculate the solution to part 2
     */
    fn solve_part_2(self: &Self) -> usize;
}

/**
 * Magic: Any Solver can also parse
 */
impl<'a, T: AOC8Solver<'a>> AOC8Parser for T {}

trait AOC8Parser {
    fn parse_challenge(input: &str) -> (&str, MyMap<&str, LeftRight>) {
        match input.trim().split("\n\n").collect::<Vec<&str>>()[0..2] {
            [lr, raw_map] => (
                lr,
                raw_map
                    .split("\n")
                    .map(|line| {
                        MAP_PARSER
                            .captures(line)
                            .unwrap()
                            .iter()
                            .skip(1)
                            .map(|c| c.unwrap().as_str())
                            .collect::<Vec<&str>>()
                    })
                    .filter(|matches| matches.len() >= 3)
                    .map(|matches| {
                        (
                            matches[0],
                            LeftRight {
                                left: matches[1],
                                right: matches[2],
                            },
                        )
                    })
                    .collect(),
            ),
            _ => {
                panic!("Problem during parsing")
            }
        }
    }

    fn walk_from_to(
        from: &str,
        to: &Regex,
        walk_instructions: &str,
        left_right_map: &MyMap<&str, LeftRight>,
        force_walk: &bool,
    ) -> usize {
        let mut current = from;
        let mut steps = 0;

        while !to.is_match(current) || (*force_walk && steps == 0) {
            let next_rl_instruction =
                walk_instructions.as_bytes()[steps % walk_instructions.len()] as char;
            let next_lr = left_right_map.get(current).unwrap();
            current = if next_rl_instruction == 'L' {
                &next_lr.left
            } else {
                &next_lr.right
            };
            steps += 1;
        }
        steps
    }

    fn get_all_locations_matching<'a>(
        matcher: &Regex,
        left_right_map: &MyMap<&'a str, LeftRight>,
    ) -> Vec<&'a str> {
        left_right_map
            .keys()
            .filter(|key| matcher.is_match(key))
            .map(|key| *key)
            .collect()
    }
}

/**
 * This trait provides a general method to walk through all the steps and find the problem solution.
 * This implementation works irrespective of the underlying data structures.
 *
 * Only certain getters for the data structures must be provided, and the structures themselves must implement
 * the common `Accessor` trait
 */
trait AOC8Walker<K> {
    fn get_walk_instructions_len(self: &Self) -> usize;
    fn get_start_positions(self: &Self) -> &Vec<K>;
    fn get_itertools(self: &Self) -> &dyn Accessor<&K, Itertool>;
    fn get_jump_map(self: &Self) -> &dyn Accessor<&K, Vec<K>>;

    fn walk_by_jump_map(self: &Self) -> usize {
        let mut steps = 0;

        let mut last = 0;
        let print_every = 50_000_000_000;

        let walk_instructions_length = self.get_walk_instructions_len();

        let mut currents: Vec<&K> = self.get_start_positions().into_iter().collect();

        #[cfg(feature = "assume_constant_z_distances")]
        let full_length_jumps = self.max_z_distance(&currents) / walk_instructions_length;

        while !self.have_same_z_distance(&currents) {
            // I think this is not ideal. I'd prefer to only mutate a variable
            // defined outside the loop, but "attributes on expressions are experimental"
            #[cfg(not(feature = "assume_constant_z_distances"))]
            let full_length_jumps = self.max_z_distance(&currents) / walk_instructions_length;

            if full_length_jumps == 0 {
                panic!("Stuck!")
            }

            steps += full_length_jumps * walk_instructions_length;

            if steps - last >= print_every {
                debug!("Now at {steps}");
                last = steps;
            }

            for current in &mut currents {
                *current = &self.get_jump_map().access(current)[full_length_jumps];
            }
        }

        steps + self.get_itertools().access(currents[0]).end_in_z_after
    }

    fn have_same_z_distance(self: &Self, keys: &Vec<&K>) -> bool {
        let z_distance_0 = self.get_itertools().access(keys[0]).end_in_z_after;
        for key in keys {
            if self.get_itertools().access(*key).end_in_z_after != z_distance_0 {
                return false;
            }
        }
        true
    }

    fn max_z_distance(self: &Self, currents: &Vec<&K>) -> usize {
        currents
            .iter()
            .map(|current| self.get_itertools().access(*current).next_z)
            .max()
            .unwrap_or(0)
    }

    #[cfg(not(feature = "use_lcm"))]
    fn internal_solve_part_2(self: &Self) -> usize {
        self.walk_by_jump_map()
    }

    #[cfg(feature = "use_lcm")]
    fn internal_solve_part_2(self: &Self) -> usize {
        least_common_multiple(
            self.get_start_positions()
                .iter()
                .map(|start_pos| self.get_itertools().access(start_pos).end_in_z_after)
                .collect(),
        )
    }
}

/**
 * Faster map with "custom" hasher.
 * Replace with any map implementation if you wish.
 */
type MyMap<K, V> = HashMap<K, V, FnvBuildHasher>;
// type MyMap<K, V> = BTreeMap<K, V>;

#[derive(Debug)]
pub struct LeftRight<'a> {
    left: &'a str,
    right: &'a str,
}

impl<'a> Accessor<char, &'a str> for LeftRight<'a> {
    fn access(self: &Self, key: char) -> &&'a str {
        match key {
            'L' => &self.left,
            'R' => &self.right,
            invalid => panic!("Tried to access struct LeftRight with \"{invalid}\", but only \"L\" and \"R\" are valid")
        }
    }
}

pub struct Itertool {
    /**
     * How many steps to take until we are at Z$. Can be 0
     */
    end_in_z_after: usize,
    /**
     * How far to the _next_ Z$. Can not be 0
     */
    next_z: usize,
}

type ItertoolMap<'a> = MyMap<&'a str, Itertool>;
type JumpMap<'a> = MyMap<&'a str, Vec<&'a str>>;

/**
 * Used to access maps and vecs using the same interface, to
 * be able to have a common walk implementation
 */
trait Accessor<K, V> {
    fn access(self: &Self, key: K) -> &V;
}

impl<K, V> Accessor<&K, V> for MyMap<K, V>
where
    K: PartialEq + Eq + Hash,
{
    fn access(self: &Self, key: &K) -> &V {
        self.get(key).unwrap()
    }
}

pub struct Walker<'a> {
    walk_map: MyMap<&'a str, LeftRight<'a>>,
    walk_instructions: &'a str,
    walk_instructions_len: usize,
    itertools: MyMap<&'a str, Itertool>,
    jump_map: JumpMap<'a>,
    pub start_positions: Vec<&'a str>,
}

/*
 * Create the jump map, which is done differently for both walkers and not public API,
 * so it does not make sense to include it in a trait
 */
impl<'a> Walker<'a> {
    fn create_jump_map(
        left_right_map: &MyMap<&'a str, LeftRight<'a>>,
        walk_instructions: &str,
    ) -> JumpMap<'a> {
        debug!("Computing jump map");
        let all_keys = left_right_map.keys();
        let all_distances_to_z = all_keys.clone().map(|key| {
            Self::walk_from_to(&key, &END_IN_Z, walk_instructions, left_right_map, &false)
        });
        let max_distance = all_distances_to_z.max().unwrap();
        let max_jumpable_distance = max_distance - (max_distance % walk_instructions.len());
        debug!("Max jumpable distance: {max_jumpable_distance}");
        let mut jump_map = MyMap::default();
        jump_map.extend(all_keys.map(|key| {
            let mut jump_list: Vec<&str> = vec![key];
            let mut current = key;
            for (i, lr) in (0..max_jumpable_distance).zip(walk_instructions.chars().cycle()) {
                let next_instruction = left_right_map.get(current).unwrap();
                let next = if lr == 'L' {
                    &next_instruction.left
                } else {
                    &next_instruction.right
                };
                if (i + 1) % walk_instructions.len() == 0 {
                    jump_list.push(next)
                };
                current = next;
            }
            (key.to_owned(), jump_list)
        }));
        debug!("Computed jump map");
        jump_map
    }
}

impl<'a> AOC8Solver<'a> for Walker<'a> {
    fn new(input: &'a str) -> Self {
        // (&'a str, HashMap<&'a str, LeftRight<'a>)
        let (walk_instructions, left_right_map) = Self::parse_challenge(&input);
        debug!("Creating new Walker");
        let mut itertools = ItertoolMap::default();
        itertools.extend(left_right_map.keys().map(|key| {
            let end_in_z_after =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &false);

            let next_z =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &true);

            (
                *key,
                Itertool {
                    end_in_z_after,
                    next_z,
                },
            )
        }));
        let jump_map = Self::create_jump_map(&left_right_map, &walk_instructions);
        let start_positions = Self::get_all_locations_matching(&END_IN_A, &left_right_map);
        debug!("Created new Walker");
        Self {
            walk_map: left_right_map,
            walk_instructions,
            walk_instructions_len: walk_instructions.len(),
            itertools,
            start_positions,
            jump_map,
        }
    }

    fn solve_part_1(self: &Self) -> usize {
        self.itertools.access(&"AAA").end_in_z_after
    }

    fn solve_part_2(self: &Self) -> usize {
        self.internal_solve_part_2()
    }
}

impl<'a> AOC8Walker<&'a str> for Walker<'a> {
    fn get_walk_instructions_len(self: &Self) -> usize {
        self.walk_instructions_len
    }

    fn get_jump_map(self: &Walker<'a>) -> &dyn Accessor<&&'a str, Vec<&'a str>> {
        &self.jump_map
    }

    fn get_start_positions(self: &Self) -> &Vec<&'a str> {
        &self.start_positions
    }

    fn get_itertools(self: &Self) -> &dyn Accessor<&&'a str, Itertool> {
        &self.itertools
    }
}

type PowerItertoolMap = Vec<Itertool>;
type PowerJumpMap = Vec<Vec<usize>>;

impl<V> Accessor<&usize, V> for Vec<V> {
    fn access(self: &Self, key: &usize) -> &V {
        &self[*key]
    }
}

pub struct PowerWalker {
    start_index_part_1: usize,
    walk_instructions_len: usize,
    itertools: Vec<Itertool>,
    start_positions: Vec<usize>,
    jump_map: PowerJumpMap,
}

impl PowerWalker {
    fn create_jump_map(
        walk_instructions: &str,
        left_right_map: &MyMap<&str, LeftRight>,
        str_to_usize: &HashMap<&str, usize>,
    ) -> PowerJumpMap {
        let all_keys = left_right_map.keys();
        let all_distances_to_z = all_keys.clone().map(|key| {
            Self::walk_from_to(&key, &END_IN_Z, walk_instructions, left_right_map, &false)
        });
        let max_distance = all_distances_to_z.max().unwrap();
        let max_jumpable_distance = max_distance - (max_distance % walk_instructions.len());
        debug!("Max jumpable distance: {max_jumpable_distance}");
        let jump_map = all_keys
            .map(|key| {
                let mut jump_list: Vec<usize> = vec![*str_to_usize.get(key).unwrap()];
                let mut current = key;
                for (i, lr) in (0..max_jumpable_distance).zip(walk_instructions.chars().cycle()) {
                    let next_instruction = left_right_map.get(current).unwrap();
                    let next = if lr == 'L' {
                        &next_instruction.left
                    } else {
                        &next_instruction.right
                    };
                    if (i + 1) % walk_instructions.len() == 0 {
                        jump_list.push(*str_to_usize.get(next).unwrap())
                    };
                    current = next;
                }
                jump_list
            })
            .collect();
        debug!("Computed jump map");
        jump_map
    }
}

impl<'a> AOC8Solver<'a> for PowerWalker {
    fn new(input: &'a str) -> Self {
        debug!("Creating new PowerWalker");
        let (walk_instructions, left_right_map) = Self::parse_challenge(&input);
        let mut itertools = PowerItertoolMap::with_capacity(left_right_map.len());

        let str_to_usize = HashMap::<&str, usize, RandomState>::from_iter(
            left_right_map
                .keys()
                .enumerate()
                .map(|(index, key)| (*key, index)),
        );

        itertools.extend(left_right_map.keys().map(|key| {
            let end_in_z_after =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &false);
            let next_z =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &true);
            Itertool {
                end_in_z_after,
                next_z,
            }
        }));

        let rust_temporary = Self::get_all_locations_matching(&END_IN_A, &left_right_map);
        let start_positions = rust_temporary
            .iter()
            .map(|x| str_to_usize.get(x).unwrap().to_owned())
            .collect();
        let jump_map = Self::create_jump_map(&walk_instructions, &left_right_map, &str_to_usize);
        let start_index_part_1 = *str_to_usize.get("AAA").unwrap();

        debug!("Created new PowerWalker");
        Self {
            start_index_part_1,
            jump_map,
            walk_instructions_len: walk_instructions.len(),
            itertools,
            start_positions,
        }
    }

    fn solve_part_1(self: &Self) -> usize {
        self.itertools
            .access(&self.start_index_part_1)
            .end_in_z_after
    }

    fn solve_part_2(self: &Self) -> usize {
        self.internal_solve_part_2()
    }
}

impl AOC8Walker<usize> for PowerWalker {
    fn get_walk_instructions_len(self: &Self) -> usize {
        self.walk_instructions_len
    }

    fn get_itertools(self: &Self) -> &dyn Accessor<&usize, Itertool> {
        &self.itertools
    }

    fn get_start_positions(self: &Self) -> &Vec<usize> {
        &self.start_positions
    }

    fn get_jump_map(self: &Self) -> &dyn Accessor<&usize, Vec<usize>> {
        &self.jump_map
    }
}

// inspired by https://stackoverflow.com/questions/31302054/how-to-find-the-least-common-multiple-of-a-range-of-numbers
pub fn least_common_multiple(numbers: Vec<usize>) -> usize {
    fn gcd(a: &usize, b: &usize) -> usize {
        return if *b == 0 {
            a.to_owned()
        } else {
            gcd(b, &(*a % *b))
        };
    }

    fn lcm(a: &usize, b: &usize) -> usize {
        (a * b) / gcd(a, b)
    }

    numbers.iter().fold(1, |multiple, num| lcm(&multiple, num))
}

pub trait AOCTracer<T> {
    /**
     * Can be used to check hypothesis that individual routes are non-overlapping
     */
    fn get_all_locations_traversed_by(
        self: &Self,
        start_point: T,
        steps: usize,
        include_start: bool,
    ) -> Result<Vec<T>, Box<dyn Error>>;

    fn build_traces(self: &Self) -> FnvHashMap<&str, Vec<TraceItem>>;

    /// Returns an iterator over debug strings listing information about the current iteration
    /// for all strands
    fn iter_steps(
        self: &Self,
        stop_at_repeat: bool,
    ) -> impl Iterator<Item = String>;
}

#[derive(Debug)]
struct InvalidArgumentChoice<T: Display> {
    was: T,
    options: Vec<T>,
}

impl<T: Display> Display for InvalidArgumentChoice<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.options.split_last() {
            Some((last, els)) => {
                write!(f, "\"{}\" is not one of ", self.was)?;
                for el in els {
                    write!(f, "{}, ", el)?;
                }
                write!(f, "{}", last)
            }
            _ => {
                write!(f, "You passed \"{}\", but in this context there are no valid candidates for this argument", self.was)
            }
        }
    }
}

impl<T: Display + Debug> Error for InvalidArgumentChoice<T> {}

pub struct TraceItem {
    pub location: String,
    pub left: String,
    pub right: String,
}

impl ToString for TraceItem {
    fn to_string(&self) -> String {
        format!("{} = ({}, {})", self.location, self.left, self.right)
    }
}

impl<'a> AOCTracer<String> for Walker<'a> {
    fn get_all_locations_traversed_by(
        self: &Self,
        start_point: String,
        steps: usize,
        include_start: bool,
    ) -> Result<Vec<String>, Box<(dyn std::error::Error + 'static)>> {
        self.start_positions
            .iter()
            .find(|val| (**val).eq(&start_point))
            .ok_or_else(|| InvalidArgumentChoice {
                was: start_point.to_owned(),
                options: self
                    .start_positions
                    .iter()
                    .map(|el| (*el).to_owned())
                    .collect(),
            })?;

        let mut current: &str = &start_point;
        let mut all_locations = FnvHashSet::default();

        if include_start {
            all_locations.insert(current);
        }

        (0..steps).into_iter().zip(self.walk_instructions.chars().cycle()).map(|(_, lr)| lr).for_each(|lr| {
            let left_right = self.walk_map.access(&current);
            match lr {
                'L' => {
                    current = left_right.left;
                },
                'R' => {
                    current = left_right.right;
                },
                invalid => {
                    unreachable!("Only \"L\" and \"R\" are valid instructions, but \"{invalid}\" was given");
                }
            }
            all_locations.insert(current);
        });

        Ok(all_locations
            .into_iter()
            .map(|val| val.to_owned())
            .collect())
    }

    fn build_traces(self: &Self) -> FnvHashMap<&str, Vec<TraceItem>> {
        let mut traced = FnvHashMap::default();
        let mut traces =
            FnvHashMap::from_iter(self.start_positions.iter().map(|pos| (*pos, vec![])));
        let mut currents =
            FnvHashMap::from_iter(self.start_positions.iter().map(|key| (*key, *key)));
        for lr in self.walk_instructions.chars().cycle() {
            for (start, current) in &mut currents {
                let left_right = self.walk_map.access(&current);

                if *traced
                    .entry(*current)
                    .and_modify(|count| *count += 1)
                    .or_insert(1usize)
                    == 1
                {
                    traces.get_mut(start).unwrap().push(TraceItem {
                        location: current.to_string(),
                        left: left_right.left.to_string(),
                        right: left_right.right.to_string(),
                    });
                }

                *current = left_right.access(lr);
            }
            if traced.len() == self.walk_map.len() {
                return traces;
            }
        }
        // should not be reached
        traces
    }

    fn iter_steps(self: &Self, stop_at_repeat: bool) -> impl Iterator<Item = String> {
        self.walk_instructions.chars().cycle().scan(
            (
                0,
                self.start_positions.clone(),
                FnvHashMap::from_iter(self.start_positions.iter().map(|pos| (*pos, 1usize))),
                false,
            ),
            move |(i, currents, iter_count, exit_after_next), lr| {
                if *exit_after_next { return None };
                if stop_at_repeat && iter_count.len() == self.walk_map.len() {
                    *exit_after_next = true;
                }
                let printable = format!(
                    "{:>4} > {:>2}: {lr}\t{}",
                    i,
                    *i / self.walk_instructions_len + 1,
                    positions_to_string(
                        &currents,
                        &self.walk_map,
                        iter_count,
                        lr,
                        Some(&iter_count)
                    )
                );
                for current in currents {
                    *current = self.walk_map.access(current).access(lr);
                    iter_count
                        .entry(*current)
                        .and_modify(|count| *count += 1)
                        .or_insert(1usize);
                }
                *i += 1;
                Some(printable)
            },
        )
    }
}

fn positions_to_string<'a>(
    positions: &'a Vec<&'a str>,
    walk_map: &dyn Accessor<&&'a str, LeftRight<'a>>,
    iter_count: &dyn Accessor<&&'a str, usize>,
    lr: char,
    duplicate_map: Option<&FnvHashMap<&str, usize>>,
) -> String {
    positions
        .iter()
        .map(|pos| {
            let already_counted = duplicate_map
                .map(|duplicates| duplicates.get(pos))
                .flatten()
                .or(Some(&1));
            let left_right = walk_map.access(pos);
            format!(
                "{:>2} x {} = ({}, {})",
                iter_count.access(pos),
                (*pos)
                    .conv::<ColoredString>()
                    .pipe_if(END_IN_A.is_match(pos), ColoredString::green)
                    .pipe_if(END_IN_Z.is_match(pos), ColoredString::red),
                &left_right
                    .left
                    .conv::<ColoredString>()
                    .pipe_if(lr == 'L', ColoredString::bold)
                    .pipe_if(END_IN_A.is_match(left_right.left), ColoredString::green)
                    .pipe_if(END_IN_Z.is_match(left_right.left), ColoredString::red),
                &left_right
                    .right
                    .conv::<ColoredString>()
                    .pipe_if(lr == 'R', ColoredString::bold)
                    .pipe_if(END_IN_A.is_match(left_right.right), ColoredString::green)
                    .pipe_if(END_IN_Z.is_match(left_right.right), ColoredString::red)
            )
            .conv::<ColoredString>()
            .pipe_if(
                already_counted.is_some_and(|val| val != &1),
                ColoredString::blue,
            )
            .to_string()
        })
        .collect::<Vec<_>>()
        .join("\t")
}

lazy_static! {
    static ref END_IN_Z: Regex = Regex::new("Z$").unwrap();
    static ref END_IN_A: Regex = Regex::new("A$").unwrap();
    static ref MAP_PARSER: Regex =
        Regex::new("^([A-Z0-9]{3}) = \\(([A-Z0-9]{3}), ([A-Z0-9]{3})\\)$").unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(any(feature = "medium_test", feature = "heavy_test"))]
    static INPUT: &str = include_str!("../../challenge.txt");
    #[cfg(feature = "medium_test")]
    const PART1: usize = 16697;
    #[cfg(feature = "heavy_test")]
    const PART2: usize = 10668805667831;

    #[test]
    fn lcm_works() {
        assert_eq!(least_common_multiple(vec![3, 7, 43]), 903);
        assert_eq!(
            least_common_multiple(vec![57356, 54673643, 4452435]),
            1074016873451150460
        );
        assert_eq!(least_common_multiple(vec![3, 3, 3]), 3);
        assert_eq!(least_common_multiple(vec![3, 24, 6]), 24);
    }

    #[cfg(feature = "medium_test")]
    #[test]
    fn walker_part_1() {
        assert_eq!(Walker::new(INPUT).solve_part_1(), PART1);
    }

    #[cfg(feature = "medium_test")]
    #[test]
    fn power_walker_part_1() {
        assert_eq!(PowerWalker::new(INPUT).solve_part_1(), PART1);
    }

    #[cfg(feature = "heavy_test")]
    #[test]
    fn walker_part_2() {
        assert_eq!(Walker::new(INPUT).solve_part_2(), PART2);
    }

    #[cfg(feature = "heavy_test")]
    #[test]
    fn power_walker_part_2() {
        assert_eq!(PowerWalker::new(INPUT).solve_part_2(), PART2);
    }
}
