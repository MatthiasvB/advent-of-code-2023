#![allow(dead_code, unused)]
use std::{
    borrow::{Borrow, BorrowMut},
    ops::{Deref, DerefMut},
};

use tap::{Conv, Pipe};

// TODO: I think this can be removed
/// Defines utilities to conditionally tap closures to values in a chainable fashion.
pub trait TapIf {
    fn tap_refborrow_if<B>(self: &Self, condition: bool, runner: impl FnOnce(&B)) -> &Self
    where
        Self: Borrow<B>,
        B: ?Sized,
    {
        if condition {
            runner(self.borrow());
        };
        self
    }

    fn tap_refborrow_mut_if<B>(
        self: &mut Self,
        condition: bool,
        modifier: impl FnOnce(&mut B),
    ) -> &mut Self
    where
        Self: BorrowMut<B>,
        B: ?Sized,
    {
        if condition {
            modifier(self.borrow_mut());
        };
        self
    }

    fn tap_refborrow_if_fulfills(
        self: &Self,
        predicate: impl FnOnce(&Self) -> bool,
        runner: impl FnOnce(&Self),
    ) -> &Self {
        self.tap_refborrow_if(predicate(self), runner)
    }

    fn tap_refborrow_mut_if_fulfills(
        self: &mut Self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&mut Self),
    ) -> &mut Self {
        self.tap_refborrow_mut_if(predicate(self), modifier)
    }
}

// macro_rules! predicate_signature {
//     ( $orig:ident, $orig_fulfills:ident ) => {
//         fn $orig(
//             self,
//             predicate: impl FnOnce(&Self) -> bool,
//             modifier: impl FnOnce(Self) -> Self,
//         ) -> Self {
//             predicate(&self).pipe(|condition| self.$orig_fulfills(condition, modifier))
//         }
//     };
// }

macro_rules! predicate_signature {
    ( $newFnName:ident; fn $name:ident($self:ident, $condition:ident: bool, $callbackName:ident: $callbackType:ty) -> Self $body:block ) => {
        fn $name($self, $condition: bool, $callbackName: $callbackType) -> Self $body

        fn $newFnName($self, predicate: impl FnOnce(&Self) -> bool, $callbackName: $callbackType) -> Self {
            predicate(&$self).pipe(|condition| $self.$name(condition, $callbackName))
        }
    }
}

macro_rules! home_brewed2 {
    ( $postfix:ident; fn $name:ident(self, condition: bool, $callbackName:ident: $callbackType:ty) ) => {

        fn $name$postfix(self, predicate: impl FnOnce(&Self) -> bool, $callbackName: $callbackType) -> Self {
            predicate(&self).pipe(|condition| self.$name(condition, $callbackName))
        }

        fn $name(self, condition: bool, $callbackName: $callbackType) -> Self { self }
    }
}

/// Defines utilities to conditionally tap closures to values in a chainable fashion.
pub trait TapIfSized
where
    Self: Sized,
{
    predicate_signature!(pipe_if_fulfills; fn pipe_if(self, condition: bool, modifier: impl FnOnce(Self) -> Self) -> Self {
        if condition {
            modifier(self)
        } else {
            self
        }
    });

    // home_brewed2!{pipe_if_fulfills; fn pipe_if(self, condition: bool, modifier: impl FnOnce(Self) -> Self)}

    // fn $name(self, condition: bool, $callbackName: $CallbackType) -> Self {
    //     $body
    // }

    // turned into

    // fn ${name}_fulfills(self: $SelfType, predicate: impl (&Self) -> bool, $callbackName: $CallbackType) -> Self {
    //     predicate(&self).pipe(|condition| self.$name(condition, modifier))
    // }

    /* fn pipe_if_fulfills(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(Self) -> Self,
    ) -> Self {
        predicate(&self).pipe(|condition| self.pipe_if(condition, modifier))
    } */

    fn tap_if(self, condition: bool, runner: impl FnOnce(&Self)) -> Self {
        if condition {
            runner(&self);
        }
        self
    }

    fn tap_borrow_if<B>(self, condition: bool, runner: impl FnOnce(&B)) -> Self
    where
        Self: Borrow<B>,
        B: ?Sized,
    {
        if condition {
            runner(self.borrow());
        }
        self
    }

    fn tap_borrow_mut_if<B>(mut self, condition: bool, runner: impl FnOnce(&mut B)) -> Self
    where
        Self: BorrowMut<B>,
        B: ?Sized,
    {
        if condition {
            runner(self.borrow_mut());
        }
        self
    }

    fn tap_ref_if<B>(self, condition: bool, runner: impl FnOnce(&B)) -> Self
    where
        Self: AsRef<B>,
        B: ?Sized,
    {
        if condition {
            runner(self.as_ref());
        }
        self
    }

    fn tap_ref_mut_if<B>(mut self, condition: bool, runner: impl FnOnce(&mut B)) -> Self
    where
        Self: AsMut<B>,
        B: ?Sized,
    {
        if condition {
            runner(self.as_mut());
        }
        self
    }

    fn tap_deref_if<B>(self, condition: bool, runner: impl FnOnce(&B)) -> Self
    where
        Self: Deref<Target = B>,
        B: ?Sized,
    {
        if condition {
            runner(&self);
        }
        self
    }

    fn tap_deref_mut_if<B>(mut self, condition: bool, runner: impl FnOnce(&mut B)) -> Self
    where
        Self: DerefMut + Deref<Target = B>,
        B: ?Sized,
    {
        if condition {
            runner(&mut self);
        }
        self
    }

    fn tap_if_fulfills(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        runner: impl FnOnce(&Self),
    ) -> Self {
        predicate(&self).pipe(|condition| self.tap_if(condition, runner))
    }

    fn tap_borrow_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&B),
    ) -> Self
    where
        Self: Borrow<B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_borrow_if(condition, modifier))
    }

    fn tap_borrow_mut_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&mut B),
    ) -> Self
    where
        Self: BorrowMut<B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_borrow_mut_if(condition, modifier))
    }

    fn tap_ref_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&B),
    ) -> Self
    where
        Self: AsRef<B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_ref_if(condition, modifier))
    }

    fn tap_ref_mut_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&mut B),
    ) -> Self
    where
        Self: AsMut<B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_ref_mut_if(condition, modifier))
    }

    fn tap_deref_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        runner: impl FnOnce(&B),
    ) -> Self
    where
        Self: Deref<Target = B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_deref_if(condition, runner))
    }

    fn tap_deref_mut_if_fulfills<B>(
        self,
        predicate: impl FnOnce(&Self) -> bool,
        runner: impl FnOnce(&mut B),
    ) -> Self
    where
        Self: DerefMut + Deref<Target = B>,
        B: ?Sized,
    {
        predicate(&self).pipe(|condition| self.tap_deref_mut_if(condition, runner))
    }
}

// Probably throw away
pub trait TapIfCloned
where
    Self: Sized + Clone,
{
    fn pipe_cloned_if(self: &Self, condition: bool, modifier: impl FnOnce(&Self) -> Self) -> Self {
        if condition {
            modifier(self)
        } else {
            self.clone()
        }
    }

    fn pipe_cloned_if_fulfills(
        self: &Self,
        predicate: impl FnOnce(&Self) -> bool,
        modifier: impl FnOnce(&Self) -> Self,
    ) -> Self {
        self.pipe_cloned_if(predicate(self), modifier)
    }
}

impl<T> TapIf for T {}
impl<T: Sized> TapIfSized for T {}
impl<T: Sized + Clone> TapIfCloned for T {}
