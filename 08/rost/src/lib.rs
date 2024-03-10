use std::collections::{BTreeMap};

pub struct Itertool<'a> {
    fullRangeTarget: &'a str,
    endInZAfter: usize,
    nextZ: usize,
}

type ItertoolMap<'a> = BTreeMap<&'a str, Itertool<'a>>;

// inspired by https://stackoverflow.com/questions/31302054/how-to-find-the-least-common-multiple-of-a-range-of-numbers
pub fn least_common_multiple(numbers: Vec<isize>) -> isize {
    fn gcd(a: isize, b: isize) -> isize {
      return if b == 0 { a } else { gcd(b, a % b) };
    }
  
    fn lcm(a: isize, b: isize) -> isize {
      (a * b) / gcd(a, b)
    }
  
    // return numbers.reduce((multiple, num) => lcm(multiple, num), 1);
    // numbers.iter().fold(|multiple, num| {
    //     lcm(multiple, num), 1
    // })
    numbers.iter().
  }
